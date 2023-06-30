import _ from 'underscore';
import React, {useState, useRef, useEffect} from 'react';
import {View, Dimensions, Linking} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import * as Expensicons from '../Icon/Expensicons';
import Popover from '../Popover';
import MenuItem from '../MenuItem';
import ZoomIcon from '../../../assets/images/zoom-icon.svg';
import GoogleMeetIcon from '../../../assets/images/google-meet.svg';
import CONST from '../../CONST';
import styles from '../../styles/styles';
import themeColors from '../../styles/themes/default';
import withWindowDimensions, {windowDimensionsPropTypes} from '../withWindowDimensions';
import withLocalize, {withLocalizePropTypes} from '../withLocalize';
import compose from '../../libs/compose';
import Tooltip from '../Tooltip';
import {propTypes as videoChatButtonAndMenuPropTypes, defaultProps} from './videoChatButtonAndMenuPropTypes';
import * as Session from '../../libs/actions/Session';
import PressableWithoutFeedback from '../Pressable/PressableWithoutFeedback';

const propTypes = {
    /** Link to open when user wants to create a new google meet meeting */
    googleMeetURL: PropTypes.string.isRequired,

    ...videoChatButtonAndMenuPropTypes,
    ...withLocalizePropTypes,
    ...windowDimensionsPropTypes,
};

const BaseVideoChatButtonAndMenu = (props) => {
    const [isVideoChatMenuActive, setMenuVisibility] = useState(false);
    const [videoChatIconPosition, setVideoChatIconPosition] = useState({x: 0, y: 0});
    const videoChatIconWrapperRef = useRef(null);
    const dimensionsEventListenerRef = useRef(null);
    const videoChatButtonRef = useRef(null);

    const menuItemData = [
        {
            icon: ZoomIcon,
            text: props.translate('videoChatButtonAndMenu.zoom'),
            onPress: () => {
                setMenuVisibility(false);
                Linking.openURL(CONST.NEW_ZOOM_MEETING_URL);
            },
        },
        {
            icon: GoogleMeetIcon,
            text: props.translate('videoChatButtonAndMenu.googleMeet'),
            onPress: () => {
                setMenuVisibility(false);
                Linking.openURL(props.googleMeetURL);
            },
        },
    ];

    /**
     * This gets called onLayout to find the cooridnates of the wrapper for the video chat button.
     */
    function measureVideoChatIconPosition() {
        if (!videoChatIconWrapperRef.current) {
            return;
        }

        videoChatIconWrapperRef.current.measureInWindow((x, y) => {
            setVideoChatIconPosition({x, y});
        });
    }

    function handleButtonPress() {
        Session.checkIfActionIsAllowed(() => {
            // Drop focus to avoid blue focus ring.
            videoChatButtonRef.current.blur();

            // If this is the Concierge chat, we'll open the modal for requesting a setup call instead
            if (props.isConcierge && props.guideCalendarLink) {
                Linking.openURL(props.guideCalendarLink);
                return;
            }
            setMenuVisibility(true);
        });
    }

    useEffect(() => {
        dimensionsEventListenerRef.current = Dimensions.addEventListener('change', measureVideoChatIconPosition);

        return () => {
            if (dimensionsEventListenerRef.current) {
                dimensionsEventListenerRef.current.remove();
            }
        };
    }, []);

    return (
        <>
            <View
                ref={videoChatIconWrapperRef}
                onLayout={measureVideoChatIconPosition}
            >
                <Tooltip text={props.translate('videoChatButtonAndMenu.tooltip')}>
                    <PressableWithoutFeedback
                        ref={videoChatButtonRef}
                        onPress={handleButtonPress}
                        style={styles.touchableButtonImage}
                        accessibilityLabel={props.translate('videoChatButtonAndMenu.tooltip')}
                        accessibilityRole="button"
                    >
                        <Icon
                            src={Expensicons.Phone}
                            fill={isVideoChatMenuActive ? themeColors.heading : themeColors.icon}
                        />
                    </PressableWithoutFeedback>
                </Tooltip>
            </View>

            <Popover
                onClose={() => setMenuVisibility(false)}
                isVisible={isVideoChatMenuActive}
                anchorPosition={{
                    left: videoChatIconPosition.x - 150,
                    top: videoChatIconPosition.y + 40,
                }}
            >
                <View style={props.isSmallScreenWidth ? {} : styles.pv3}>
                    {_.map(menuItemData, ({icon, text, onPress}) => (
                        <MenuItem
                            wrapperStyle={styles.mr3}
                            key={text}
                            icon={icon}
                            title={text}
                            onPress={onPress}
                        />
                    ))}
                </View>
            </Popover>
        </>
    );
};

BaseVideoChatButtonAndMenu.propTypes = propTypes;
BaseVideoChatButtonAndMenu.defaultProps = defaultProps;
BaseVideoChatButtonAndMenu.displayName = 'BaseVideoChatButtonAndMenu';

export default compose(withWindowDimensions, withLocalize)(BaseVideoChatButtonAndMenu);
